const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const formatTime = (time) => {
  return time.substring(0, 5);
};

const normalizeDate = (dateStr) => {
  return dateStr.split('T')[0];
};

const normalizeTime = (timeStr) => {
  return timeStr.substring(0, 5);
};

module.exports = {
  formatDate,
  formatTime,
  normalizeDate,
  normalizeTime
};