const express = require("express");
const {
  getMaterialFile,
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} = require("../controllers/materialController");
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { uploadMaterial } = require("../middleware/uploadMiddleware");

const router = express.Router();

// ADDED: public file route — must be BEFORE protect (window.open can't send a token)
router.get("/:id/file", getMaterialFile);

router.use(protect);

router.get("/", getMaterials); // both roles
router.post(
  "/",
  requireRole("trainer"),
  uploadMaterial.single("file"),
  createMaterial
);

router.get("/:id", getMaterialById); // both roles
router.put(
  "/:id",
  requireRole("trainer"),
  uploadMaterial.single("file"),
  updateMaterial
);
router.delete("/:id", requireRole("trainer"), deleteMaterial);

module.exports = router;