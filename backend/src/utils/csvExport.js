const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const os   = require('os');
const fs   = require('fs');

/**
 * Generate a CSV file from an array of objects and return the file path
 */
const generateCSV = async (records, filename, headers) => {
  const filePath = path.join(os.tmpdir(), `${filename}-${Date.now()}.csv`);
  const csvWriter = createObjectCsvWriter({
    path:   filePath,
    header: headers,
  });
  await csvWriter.writeRecords(records);
  return filePath;
};

/**
 * Stream CSV response to client and clean up
 */
const streamCSV = (res, filePath, downloadName) => {
  res.download(filePath, downloadName, (err) => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
};

module.exports = { generateCSV, streamCSV };
