const mongoose = require("mongoose");

const subscription = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { Timestamp: true },
);

const Subscription = mongoose.model("Subscription", subscription);

module.exports = {
  Subscription,
};
