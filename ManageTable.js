import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Upload } from 'lucide-react';

const ManageTable = () => {
  const [tables, setTables] = useState([]);
  const [newTableName, setNewTableName] = useState('');
  const [bulkTablePrefix, setBulkTablePrefix] = useState('Table');
  const [bulkTableCount, setBulkTableCount] = useState(1);
  const [editingTable, setEditingTable] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTables, setSelectedTables] = useState([]);

  // Fetch existing tables on component mount
  useEffect(() => {
    fetchTables();
  }, []);

  // Fetch tables from backend
  const fetchTables = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tables/tables'); 
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      const data = await response.json();
      setTables(data.tables || []);
      setIsLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Add single table
  const handleAddTable = async (e) => {
    e.preventDefault();
    
    // Validate table name
    if (!newTableName.trim()) {
      alert('Please enter a valid table name');
      return;
    }

    // Check if table name already exists
    if (tables.some(table => table.name.toLowerCase() === newTableName.trim().toLowerCase())) {
      alert('Table name already exists');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/tables/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTableName.trim(),
          status: 'available' // default status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add table');
      }

      const addedTable = await response.json();
      setTables([...tables, addedTable]);
      setNewTableName(''); // Reset input
    } catch (err) {
      alert(`Error adding table: ${err.message}`);
    }
  };

  // Bulk add tables
  const handleBulkAddTables = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!bulkTablePrefix.trim()) {
      alert('Please enter a valid table prefix');
      return;
    }

    if (bulkTableCount < 1) {
      alert('Please enter a valid number of tables');
      return;
    }

    // Check for existing table names
    const newTableNames = Array.from({ length: bulkTableCount }, (_, i) => 
      `${bulkTablePrefix} ${i + 1}`
    );

    const existingTableNames = tables.map(table => table.name.toLowerCase());
    const duplicateNames = newTableNames.filter(name => 
      existingTableNames.includes(name.toLowerCase())
    );

    if (duplicateNames.length > 0) {
      alert(`Table names already exist: ${duplicateNames.join(', ')}`);
      return;
    }

    try {
      // Bulk create tables
      const tableCreationPromises = newTableNames.map(name => 
        fetch('http://localhost:5000/api/tables/tables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name,
            status: 'available'
          })
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Failed to add table ${name}`);
          }
          return response.json();
        })
      );

      const newTables = await Promise.all(tableCreationPromises);
      
      // Update tables state
      setTables([...tables, ...newTables]);
      
      // Reset bulk add inputs
      setBulkTablePrefix('Table');
      setBulkTableCount(1);
    } catch (err) {
      alert(`Error adding tables: ${err.message}`);
    }
  };

  // Delete single table
  const handleDeleteTable = async (tableId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this table?');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tables/tables/${tableId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete table');
      }

      setTables(tables.filter(table => table._id !== tableId));
      // Remove from selected tables if it was selected
      setSelectedTables(selectedTables.filter(id => id !== tableId));
    } catch (err) {
      alert(`Error deleting table: ${err.message}`);
    }
  };

  // Bulk delete tables
  const handleBulkDeleteTables = async () => {
    if (selectedTables.length === 0) {
      alert('No tables selected for deletion');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedTables.length} table(s)?`);
    if (!confirmDelete) return;

    try {
      // Bulk delete promises
      const deletePromises = selectedTables.map(tableId => 
        fetch(`http://localhost:5000/api/tables/tables/${tableId}`, {
          method: 'DELETE'
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Failed to delete table ${tableId}`);
          }
          return tableId;
        })
      );

      // Wait for all delete operations to complete
      await Promise.all(deletePromises);

      // Update tables state
      setTables(tables.filter(table => !selectedTables.includes(table._id)));
      
      // Clear selected tables
      setSelectedTables([]);
    } catch (err) {
      alert(`Error deleting tables: ${err.message}`);
    }
  };

  // Toggle table selection for bulk actions
  const toggleTableSelection = (tableId) => {
    setSelectedTables(prev => 
      prev.includes(tableId)
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  // Select all tables
  const selectAllTables = () => {
    if (selectedTables.length === tables.length) {
      // If all are selected, deselect all
      setSelectedTables([]);
    } else {
      // Select all table IDs
      setSelectedTables(tables.map(table => table._id));
    }
  };

  // Edit table
  const handleEditTable = async (e) => {
    e.preventDefault();
    
    if (!editingTable || !editingTable.name.trim()) {
      alert('Please enter a valid table name');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/tables/tables/${editingTable._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingTable.name.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update table');
      }

      const updatedTable = await response.json();
      setTables(tables.map(table => 
        table._id === updatedTable._id ? updatedTable : table
      ));
      
      // Reset editing state
      setEditingTable(null);
    } catch (err) {
      alert(`Error updating table: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="spinner-border animate-spin text-blue-600" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Manage Tables</h1>
        
        {/* Single Table Add Form */}
        <form 
          onSubmit={editingTable ? handleEditTable : handleAddTable} 
          className="mb-6 flex space-x-3"
        >
          <input 
            type="text" 
            placeholder={editingTable ? 'Edit table name' : 'Enter new table name'}
            value={editingTable ? editingTable.name : newTableName}
            onChange={(e) => editingTable 
              ? setEditingTable({...editingTable, name: e.target.value}) 
              : setNewTableName(e.target.value)
            }
            className="flex-grow border rounded px-3 py-2"
          />
          <button 
            type="submit" 
            className={`
              flex items-center px-4 py-2 rounded 
              ${editingTable 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              }
            `}
          >
            {editingTable ? 'Update Table' : 'Add Table'}
          </button>
          {editingTable && (
            <button 
              type="button"
              onClick={() => setEditingTable(null)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </form>

        {/* Bulk Add Tables Form */}
        <form 
          onSubmit={handleBulkAddTables} 
          className="mb-6 flex space-x-3"
        >
          <input 
            type="text" 
            placeholder="Table Prefix"
            value={bulkTablePrefix}
            onChange={(e) => setBulkTablePrefix(e.target.value)}
            className="border rounded px-3 py-2 w-1/3"
          />
          <input 
            type="number" 
            placeholder="Number of Tables"
            value={bulkTableCount}
            onChange={(e) => setBulkTableCount(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            className="border rounded px-3 py-2 w-1/3"
          />
          <button 
            type="submit" 
            className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            <Upload size={18} className="mr-2" />
            Bulk Add Tables
          </button>
        </form>

        {/* Bulk Delete Button */}
        {selectedTables.length > 0 && (
          <div className="mb-4">
            <button 
              onClick={handleBulkDeleteTables}
              className="flex items-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              <Trash2 size={18} className="mr-2" />
              Delete {selectedTables.length} Selected Tables
            </button>
          </div>
        )}

        {/* Tables List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Select All Checkbox */}
          <div className="col-span-full mb-2 flex items-center">
            <input 
              type="checkbox"
              checked={selectedTables.length === tables.length}
              onChange={selectAllTables}
              className="mr-2"
            />
            <span>Select All</span>
          </div>

          {tables.map((table) => (
            <div 
              key={table._id} 
              className={`
                bg-gray-50 p-4 rounded-lg shadow-sm flex justify-between items-center
                ${selectedTables.includes(table._id) ? 'border-2 border-blue-500' : ''}
              `}
            >
              <div className="flex items-center space-x-3">
                <input 
                  type="checkbox"
                  checked={selectedTables.includes(table._id)}
                  onChange={() => toggleTableSelection(table._id)}
                  className="mr-2"
                />
                <div>
                  <h3 className="text-lg font-semibold">{table.name}</h3>
                  <p className="text-sm text-gray-500">
                    Status: {table.status || 'Available'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setEditingTable(table)}
                  className="text-yellow-600 hover:bg-yellow-100 p-2 rounded"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDeleteTable(table._id)}
                  className="text-red-600 hover:bg-red-100 p-2 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {tables.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No tables found. Add a new table to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTable;