const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mongoose = require('mongoose');
const checkDiskSpaceModule = require('check-disk-space');
const checkDiskSpace = checkDiskSpaceModule.default || checkDiskSpaceModule;

const db = require('~/models');
const { requireJwtAuth, configMiddleware } = require('~/server/middleware');
const { contactImportQueue } = require('../services/workers/contactImportWorker');
const logger = require('~/config/winston');

const router = express.Router();

// Enforce authentication on all contact routes
router.use(requireJwtAuth);

// Thresholds for disk space check (50MB)
const MIN_FREE_THRESHOLD = 50 * 1024 * 1024;
const MAX_UPLOAD_SIZE = parseInt(process.env.CONTACTS_MAX_UPLOAD_SIZE) || 500 * 1024 * 1024;

// Configure uploads directory
const uploadDir = path.join(process.cwd(), 'uploads', 'contacts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      ext === '.csv' ||
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed.'), false);
    }
  },
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
  },
});

/**
 * GET /api/contacts/disk-space
 * Check server disk space before accepting CSV upload
 */
router.get('/disk-space', async (req, res) => {
  try {
    const stats = await checkDiskSpace(uploadDir);
    const hasEnoughSpace = stats.free > MIN_FREE_THRESHOLD;

    res.json({
      availableBytes: stats.free,
      maxUploadBytes: MAX_UPLOAD_SIZE,
      canAcceptUpload: hasEnoughSpace,
    });
  } catch (error) {
    logger.error('Disk space check failed:', error);
    res.json({
      availableBytes: 0,
      maxUploadBytes: MAX_UPLOAD_SIZE,
      canAcceptUpload: true, // Default to true if check fails to prevent blocking user
      error: error.message,
    });
  }
});

/**
 * GET /api/contacts
 * Paginated contacts list (cursor-based) with optional tag, company, or search filter
 */
router.get('/', configMiddleware, async (req, res) => {
  try {
    const { cursor, limit, search, tag, company } = req.query;
    const result = await db.getContactsByCursor(req.user.id, {
      cursor,
      limit: limit ? parseInt(limit, 10) : 50,
      search,
      tag,
      company,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contacts/search
 * Search contacts with scores or regex (used in tool & front-end)
 */
router.post('/search', async (req, res) => {
  try {
    const { query, limit, field } = req.body;
    const contacts = await db.searchContacts(req.user.id, query || '', {
      limit: limit ? parseInt(limit, 10) : 15,
      field,
    });
    res.json({ contacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/contacts/:id
 * Retrieve a single contact
 */
router.get('/:id', async (req, res) => {
  try {
    const contact = await db.getContact(req.user.id, req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contacts
 * Create a new contact
 */
router.post('/', async (req, res) => {
  try {
    const { name, company, role, email, notes, tags, metadata } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const contact = await db.createContact({
      userId: req.user.id,
      name: name.trim(),
      company,
      role,
      email,
      notes,
      tags,
      metadata,
      tenantId: req.user.tenantId,
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/contacts/:id
 * Update an existing contact
 */
router.put('/:id', async (req, res) => {
  try {
    const contact = await db.updateContact(req.user.id, req.params.id, req.body);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/contacts/:id
 * Soft-delete a contact
 */
router.delete('/:id', async (req, res) => {
  try {
    const success = await db.deleteContact(req.user.id, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/contacts/import
 * Upload CSV file and queue the import job
 */
router.post(
  '/import',
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        logger.error('Multer file upload error:', err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No CSV file provided.' });
      }

      if (!contactImportQueue) {
        // Cleanup file if redis queue not available
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(503).json({
          error:
            'Background processing service is currently unavailable. Please ensure Redis is running.',
        });
      }

      // Create tracking job in DB
      const ContactImportJob = mongoose.models.ContactImportJob;
      const jobRecord = await ContactImportJob.create({
        user: req.user.id,
        status: 'pending',
        fileName: req.file.originalname,
        filePath: req.file.path,
        totalRows: 0,
        processedRows: 0,
        failedRows: 0,
        errors: [],
        tenantId: req.user.tenantId,
      });

      // Queue BullMQ job
      await contactImportQueue.add(
        'import',
        {
          jobId: jobRecord._id.toString(),
          filePath: req.file.path,
          userId: req.user.id,
          tenantId: req.user.tenantId,
        },
        {
          jobId: jobRecord._id.toString(),
        },
      );

      res.status(202).json({
        message: 'CSV upload accepted. Import processing started in the background.',
        jobId: jobRecord._id,
      });
    } catch (error) {
      logger.error('CSV import setup failed:', error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * GET /api/contacts/import/:jobId
 * Get progress status of the CSV import job
 */
router.get('/import/:jobId', async (req, res) => {
  try {
    const ContactImportJob = mongoose.models.ContactImportJob;
    const job = await ContactImportJob.findOne({
      _id: req.params.jobId,
      user: req.user.id,
    }).lean();

    if (!job) {
      return res.status(404).json({ error: 'Import job not found' });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
