import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import './YourSheltersContent.css';

const YourSheltersContent = () => {
  const [userShelters, setUserShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingShelter, setAddingShelter] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newShelter, setNewShelter] = useState({
    name: '',
    address: '',
    capacity: '',
    contactPerson: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchUserShelters();
  }, []);

  const fetchUserShelters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user-shelters', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // No user shelters found, start with empty array
          setUserShelters([]);
          return;
        }
        throw new Error(`Failed to fetch user shelters: ${response.status}`);
      }
      
      const data = await response.json();
      setUserShelters(data);
    } catch (err) {
      console.error('Error fetching user shelters:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  const handleAddShelter = async (e) => {
    e.preventDefault();
    
    if (!newShelter.name || !newShelter.address || !newShelter.capacity) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setAddingShelter(true);
      setError(null);
      
      const response = await fetch('/api/user-shelters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newShelter)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add shelter: ${response.status}`);
      }
      
      const addedShelter = await response.json();
      setUserShelters([...userShelters, addedShelter]);
      setShowAddForm(false);
      setNewShelter({
        name: '',
        address: '',
        capacity: '',
        contactPerson: '',
        phone: '',
        email: ''
      });
    } catch (err) {
      console.error('Error adding shelter:', err);
      setError(err.message);
    } finally {
      setAddingShelter(false);
    }
  };

  const handleRemoveShelter = async (shelterId) => {
    try {
      const response = await fetch(`/api/user-shelters/${shelterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to remove shelter: ${response.status}`);
      }
      
      setUserShelters(userShelters.filter(shelter => shelter._id !== shelterId));
    } catch (err) {
      console.error('Error removing shelter:', err);
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewShelter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="your-shelters-content">
        <LoadingSpinner size="large" text="Loading your shelters..." />
      </div>
    );
  }

  return (
    <div className="your-shelters-content">
      <div className="content-header">
        <h2>Your Shelters</h2>
        <p>Manage the shelters you are responsible for</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="dismiss-btn">
            Dismiss
          </button>
        </div>
      )}

      <div className="shelters-section">
        <div className="section-header">
          <h3>Managed Shelters</h3>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-shelter-btn"
          >
            {showAddForm ? 'Cancel' : 'Add Shelter'}
          </button>
        </div>

        {showAddForm && (
          <div className="add-shelter-form">
            <form onSubmit={handleAddShelter}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Shelter Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newShelter.name}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="address">Address *</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={newShelter.address}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="capacity">Capacity *</label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={newShelter.capacity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="contactPerson">Contact Person</label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={newShelter.contactPerson}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={newShelter.phone}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newShelter.email}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  disabled={addingShelter}
                  className="submit-btn"
                >
                  {addingShelter ? (
                    <>
                      <LoadingSpinner size="small" />
                      Adding Shelter...
                    </>
                  ) : (
                    'Add Shelter'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {userShelters.length === 0 ? (
          <div className="no-shelters">
            <h4>No Shelters Added</h4>
            <p>You haven't added any shelters yet. Click "Add Shelter" to get started.</p>
          </div>
        ) : (
          <div className="shelters-grid">
            {userShelters.map((shelter) => (
              <div key={shelter._id} className="shelter-card">
                <div className="shelter-header">
                  <h4>{shelter.name}</h4>
                  <button
                    onClick={() => handleRemoveShelter(shelter._id)}
                    className="remove-btn"
                    title="Remove shelter"
                  >
                    ×
                  </button>
                </div>
                
                <div className="shelter-details">
                  <div className="detail-item">
                    <span className="label">Address:</span>
                    <span className="value">{shelter.address}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="label">Capacity:</span>
                    <span className="value">{shelter.capacity}</span>
                  </div>
                  
                  {shelter.contactPerson && (
                    <div className="detail-item">
                      <span className="label">Contact:</span>
                      <span className="value">{shelter.contactPerson}</span>
                    </div>
                  )}
                  
                  {shelter.phone && (
                    <div className="detail-item">
                      <span className="label">Phone:</span>
                      <span className="value">{shelter.phone}</span>
                    </div>
                  )}
                  
                  {shelter.email && (
                    <div className="detail-item">
                      <span className="label">Email:</span>
                      <span className="value">{shelter.email}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YourSheltersContent; 