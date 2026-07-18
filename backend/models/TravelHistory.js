const mongoose = require("mongoose");
const crypto = require("crypto");

const algorithm = 'aes-256-cbc';

const encryptText = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const secureKey = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'default_secret_key_needs_to_be_replaced').digest();
  
  const cipher = crypto.createCipheriv(algorithm, secureKey, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decryptText = (text) => {
  if (!text) return text;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const secureKey = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'default_secret_key_needs_to_be_replaced').digest();
    
    const decipher = crypto.createDecipheriv(algorithm, secureKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    return "Error decrypting notes";
  }
};

const travelHistorySchema = new mongoose.Schema(
  {
    traveller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HostListing",
      required: true,
    },
    stayRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StayRequest",
      required: true,
    },
    arrivalDate: {
      type: Date,
      required: true,
    },
    departureDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      default: "completed",
    },
    privateNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

travelHistorySchema.pre("save", function (next) {
  if (this.isModified("privateNotes") && this.privateNotes) {
    this.privateNotes = encryptText(this.privateNotes);
  }
  next();
});

travelHistorySchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.privateNotes) {
    update.privateNotes = encryptText(update.privateNotes);
  }
  next();
});

travelHistorySchema.methods.getDecryptedNotes = function () {
  return decryptText(this.privateNotes);
};

module.exports = mongoose.model("TravelHistory", travelHistorySchema);
