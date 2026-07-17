const cron = require('node-cron')

/**
 * Scheduled tasks — scaffold only.
 *
 * Nothing is registered yet: the modules that would need a schedule
 * (Social Engine, WhatsApp broadcasts, GTA Scraper) are still placeholders.
 * When they land, register them here and call start() from index.js.
 *
 * Example:
 *   cron.schedule('0 6 * * *', dailyContentPipeline, {
 *     timezone: 'America/Toronto',
 *   })
 */

const jobs = []

function start() {
  jobs.forEach((job) => job.start())
  console.log(`[cron] ${jobs.length} scheduled job(s) started`)
}

function stop() {
  jobs.forEach((job) => job.stop())
}

module.exports = { start, stop, cron }
