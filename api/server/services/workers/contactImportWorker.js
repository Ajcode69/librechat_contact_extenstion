const fs = require('fs');
const mongoose = require('mongoose');
const { Queue, Worker } = require('bullmq');
const csv = require('fast-csv');
const IoRedis = require('ioredis');
const logger = require('~/config/winston');
const db = require('~/models');
const { embedAndStoreContacts } = require('../Contacts/service');

const REDIS_URI = process.env.REDIS_URI || 'redis://127.0.0.1:6379';
const BATCH_SIZE = parseInt(process.env.CONTACTS_IMPORT_BATCH_SIZE) || 5000;

// Initialize Redis connection
let redisConnection;
try {
  redisConnection = new IoRedis(REDIS_URI, {
    maxRetriesPerRequest: null, // Required by BullMQ
  });
  redisConnection.on('error', (err) => {
    logger.error('Redis worker connection error:', err);
  });
} catch (err) {
  logger.error('Failed to initialize Redis connection for worker:', err);
}

// Queue name
const QUEUE_NAME = 'contact-import';

// Initialize Queue
let contactImportQueue;
if (redisConnection) {
  contactImportQueue = new Queue(QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false,
    },
  });
}

// Known contact schema fields
const KNOWN_FIELDS = ['name', 'company', 'role', 'email', 'notes'];

/**
 * Worker job handler
 */
async function processContactImport(job) {
  const { jobId, filePath, userId, tenantId } = job.data;
  logger.info(`Starting contact import job: ${jobId} for user ${userId}`);

  // Fetch job document from DB
  const ContactImportJob = mongoose.models.ContactImportJob;
  if (!ContactImportJob) {
    throw new Error('ContactImportJob model not registered');
  }

  const dbJob = await ContactImportJob.findById(jobId);
  if (!dbJob) {
    throw new Error(`Import job record not found in database: ${jobId}`);
  }

  // Update status to processing
  dbJob.status = 'processing';
  await dbJob.save();

  const isAzure = filePath.startsWith('http');
  if (!isAzure && !fs.existsSync(filePath)) {
    dbJob.status = 'failed';
    dbJob.errors.push({ row: 0, message: `Uploaded CSV file not found on server disk.` });
    await dbJob.save();
    throw new Error(`CSV file not found: ${filePath}`);
  }

  return new Promise(async (resolve, reject) => {
    let stream;
    try {
      if (isAzure) {
        const { getAzureFileStream } = require('../Files/Azure/crud');
        stream = await getAzureFileStream(null, filePath);
      } else {
        stream = fs.createReadStream(filePath);
      }
    } catch (err) {
      dbJob.status = 'failed';
      dbJob.errors.push({ row: 0, message: `Failed to open CSV stream: ${err.message}` });
      await dbJob.save();
      return reject(err);
    }

    const contactsBatch = [];
    let rowCount = 0;
    const alreadyProcessed = (dbJob.processedRows || 0) + (dbJob.failedRows || 0);
    let successCount = dbJob.processedRows || 0;
    let failedCount = dbJob.failedRows || 0;
    const errorsList = [];

    async function commitBatch(batch, errors) {
      const session = await mongoose.startSession();
      session.startTransaction();
      let insertedDocs = [];
      try {
        let inserted = 0;
        let failed = 0;

        if (batch.length > 0) {
          const result = await db.bulkCreateContacts(
            userId,
            batch,
            jobId,
            tenantId,
            session
          );
          inserted = result.inserted;
          failed = result.failed;
          insertedDocs = result.insertedDocs || [];
        }

        successCount += inserted;
        failedCount += failed + errors.length;

        // Update the job progress in the database inside the transaction
        await ContactImportJob.findByIdAndUpdate(
          jobId,
          {
            processedRows: successCount,
            failedRows: failedCount,
            $push: { errors: { $each: errors } },
          },
          { session }
        );

        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }

      if (insertedDocs.length > 0) {
        try {
          await embedAndStoreContacts(
            insertedDocs.map((doc) => ({
              _id: doc._id,
              name: doc.name,
              company: doc.company,
              role: doc.role,
              email: doc.email,
              notes: doc.notes,
              tags: doc.tags,
              metadata: doc.metadata,
            })),
          );
        } catch (embedErr) {
          logger.error(`Embedding batch failed for job ${jobId}:`, embedErr);
        }
      }
    }

    // Stream and parse CSV
    const csvParser = csv.parse({ headers: true, trim: true, skipEmptyLines: true });

    csvParser.on('data', (row) => {
      rowCount++;
      if (rowCount <= alreadyProcessed) {
        return;
      }

      try {
        // Validation: name is required
        if (!row.name || !row.name.trim()) {
          errorsList.push({
            row: rowCount,
            message: 'Name is a required field and cannot be empty.',
          });
          return;
        }

        const contactData = {
          name: row.name.trim(),
          company: row.company ? row.company.trim() : '',
          role: row.role ? row.role.trim() : '',
          email: row.email ? row.email.trim() : '',
          notes: row.notes ? row.notes.trim() : '',
          tags: [],
          metadata: {},
        };

        // Parse tags
        if (row.tags) {
          contactData.tags = row.tags
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0);
        }

        // Put any unknown columns into metadata
        Object.keys(row).forEach((key) => {
          const lowerKey = key.toLowerCase().trim();
          if (!KNOWN_FIELDS.includes(lowerKey) && lowerKey !== 'tags') {
            contactData.metadata[key] = row[key];
          }
        });

        contactsBatch.push(contactData);

        // Batch insert check
        if (contactsBatch.length + errorsList.length >= BATCH_SIZE) {
          // Pause parser during database write to manage memory and flow
          csvParser.pause();
          const currentBatch = [...contactsBatch];
          contactsBatch.length = 0; // Clear array
          const currentErrors = [...errorsList];
          errorsList.length = 0; // Clear array

          commitBatch(currentBatch, currentErrors)
            .then(() => {
              csvParser.resume();
            })
            .catch((err) => {
              logger.error('Transaction batch failed, aborting import:', err);
              csvParser.destroy(err);
            });
        }
      } catch (err) {
        logger.error(`Error parsing row ${rowCount}:`, err);
        errorsList.push({
          row: rowCount,
          message: `Unexpected error: ${err.message}`,
        });
      }
    });

    csvParser.on('error', async (err) => {
      logger.error('CSV stream parsing error:', err);
      dbJob.status = 'failed';
      dbJob.errors.push({ row: rowCount, message: `CSV Parsing error: ${err.message}` });
      await dbJob.save();
      cleanupFile(filePath);
      reject(err);
    });

    csvParser.on('end', async () => {
      try {
        // Commit any remaining contacts or errors in the final batch
        if (contactsBatch.length > 0 || errorsList.length > 0) {
          await commitBatch(contactsBatch, errorsList);
        }

        // Save final job status
        dbJob.status = failedCount > 0 && successCount === 0 ? 'failed' : 'completed';
        dbJob.totalRows = rowCount;
        dbJob.processedRows = successCount;
        dbJob.failedRows = failedCount;

        await dbJob.save();
        logger.info(
          `Completed contact import job: ${jobId}. Total: ${rowCount}, Success: ${successCount}, Failed: ${failedCount}`,
        );

        cleanupFile(filePath);
        resolve({ successCount, failedCount, total: rowCount });
      } catch (err) {
        logger.error('Error completing contact import job:', err);
        dbJob.status = 'failed';
        dbJob.errors.push({ row: rowCount, message: `Finalization error: ${err.message}` });
        await dbJob.save();
        cleanupFile(filePath);
        reject(err);
      }
    });

    stream.pipe(csvParser);
  });
}

function cleanupFile(filePath) {
  try {
    if (filePath && !filePath.startsWith('http') && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    logger.error(`Failed to delete temp file ${filePath}:`, err);
  }
}

// Initialize Worker
let contactImportWorker;
if (redisConnection) {
  contactImportWorker = new Worker(QUEUE_NAME, processContactImport, {
    connection: redisConnection,
    concurrency: 1, // Process one CSV import at a time to prevent server/db overload
  });

  contactImportWorker.on('completed', (job) => {
    logger.info(`Worker job ${job.id} completed successfully`);
  });

  contactImportWorker.on('failed', (job, err) => {
    logger.error(`Worker job ${job ? job.id : 'unknown'} failed:`, err);
  });
}

module.exports = {
  contactImportQueue,
  contactImportWorker,
};
