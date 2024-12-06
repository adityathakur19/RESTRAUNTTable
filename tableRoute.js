const express = require('express');
const router = express.Router();
const Table = require('./table'); // adjust path as needed

// Get all tables
router.get('/tables', async (req, res) => {
  try {
    const tables = await Table.find().sort({ createdAt: -1 });
    res.json({ tables });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new table
router.post('/tables', async (req, res) => {
  try {
    const { name, status } = req.body;
    
    // Check if table with same name already exists
    const existingTable = await Table.findOne({ name });
    if (existingTable) {
      return res.status(400).json({ message: 'Table name already exists' });
    }

    const newTable = new Table({ name, status });
    const savedTable = await newTable.save();
    res.status(201).json(savedTable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a table
router.put('/tables/:id', async (req, res) => {
  try {
    const { name, status } = req.body;
    const updatedTable = await Table.findByIdAndUpdate(
      req.params.id, 
      { name, status }, 
      { new: true, runValidators: true }
    );
    
    if (!updatedTable) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    res.json(updatedTable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a table
router.delete('/tables/:id', async (req, res) => {
  try {
    const deletedTable = await Table.findByIdAndDelete(req.params.id);
    
    if (!deletedTable) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
