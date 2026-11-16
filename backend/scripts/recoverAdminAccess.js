require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const readInput = (prompt, { hidden = false } = {}) =>
  new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
      reject(new Error("Run this command in an interactive terminal."));
      return;
    }

    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    let value = "";
    const finish = () => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdout.write("\n");
    };

    const onData = (input) => {
      const character = input.toString("utf8");

      if (character === "\u0003" || character === "\u0004") {
        finish();
        reject(new Error("Recovery cancelled."));
      } else if (character === "\r" || character === "\n") {
        finish();
        resolve(value);
      } else if (character === "\u007f" || character === "\b") {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else if (character >= " ") {
        value += character;
        process.stdout.write(hidden ? "*" : character);
      }
    };

    process.stdin.on("data", onData);
  });

async function main() {
  await connectDB();

  const hostConfirmation = await readInput(
    "Check the connected database host above. Type YES to continue: "
  );
  if (hostConfirmation.trim() !== "YES") {
    throw new Error("Recovery cancelled.");
  }

  const admins = await User.find({ role: "admin" })
    .select("name email isActive")
    .sort({ createdAt: 1 })
    .lean();

  if (admins.length === 0) {
    throw new Error("No admin accounts exist. Provision the initial admin using your trusted database setup.");
  }

  console.log("Select the admin account to recover:");
  admins.forEach((admin, index) => {
    console.log(`${index + 1}. ${admin.name} <${admin.email}>`);
  });

  const selection = Number(await readInput("Account number: "));
  if (!Number.isInteger(selection) || selection < 1 || selection > admins.length) {
    throw new Error("Invalid account selection.");
  }

  const selectedAdmin = admins[selection - 1];
  if (!selectedAdmin.isActive) {
    throw new Error("That admin account is inactive. Recovery does not reactivate accounts.");
  }

  const password = await readInput("New password (at least 6 characters): ", { hidden: true });
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const confirmation = await readInput("Confirm new password: ", { hidden: true });
  if (password !== confirmation) {
    throw new Error("Passwords do not match.");
  }

  const admin = await User.findById(selectedAdmin._id);
  if (!admin || admin.role !== "admin" || !admin.isActive) {
    throw new Error("The selected admin account is no longer available.");
  }

  admin.password = password;
  await admin.save();

  console.log(`Password reset for ${admin.email}. You can now sign in.`);
}

main()
  .catch((error) => {
    console.error(`Admin recovery failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
