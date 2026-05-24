/**
 * In-memory email queue with retry logic.
 * Processes emails sequentially to avoid overwhelming the SMTP server.
 */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

class EmailQueue {
  constructor() {
     this.queue = [];
    this.processing = false;
  }

  /**
   * Add an email send task to the queue.
   * @param {Function} taskFn - Async function that sends the email
   * @param {number} retries - Current retry count (internal use)
   */
  add(taskFn, retries = 0) {
    this.queue.push({ taskFn, retries });
    this.process();
  }

  async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();

      try {
        await item.taskFn();
      } catch (error) {
        console.error(`Email queue error (attempt ${item.retries + 1}):`, error.message);

        if (item.retries < MAX_RETRIES - 1) {
          item.retries += 1;
          this.queue.push(item);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * item.retries));
        }
      }
    }

    this.processing = false;
  }

  get pendingCount() {
    return this.queue.length;
  }
}

module.exports = new EmailQueue();
