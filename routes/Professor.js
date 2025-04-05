const express = require('express');
const router = express.Router();
const Professor = require('../models/Professor');
const Student = require('../models/Student'); // Assuming you have this model
const Resource = require('../models/Resource'); // Assuming you have this model

// Get all students of a professor
router.get('/students', async (req, res) => {
  try {
    const professor = await Professor.findById(req.professorId).populate('students');
    res.json(professor.students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all announcements for the professor
router.get('/announcements', async (req, res) => {
  try {
    const professor = await Professor.findById(req.professorId).populate('announcements');
    res.json(professor.announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resource request (AR/VR)
router.post('/resources/request', async (req, res) => {
  const { resourceId, professorId } = req.body;
  try {
    const professor = await Professor.findById(professorId);
    if (professor) {
      const resource = await Resource.findById(resourceId);
      resource.requestedBy.push(professorId);
      await resource.save();
      res.status(200).json({ message: "Resource requested successfully." });
    } else {
      res.status(404).json({ message: "Professor not found." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
