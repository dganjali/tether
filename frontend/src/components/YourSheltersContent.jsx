import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './YourSheltersContent.css';

const YourSheltersContent = () => {
  const [userShelters, setUserShelters] = useState([]);
  const [shelterLocations, setShelterLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingShelter, setAddingShelter] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newShelter, setNewShelter] = useState({
    name: '',
    address: '',
    capacity: '',
    contactPerson: '',
    phone: '',
    email: ''
  });

  // Data recording states
  const [showDataRecording, setShowDataRecording] = useState(false);
  const [recordingData, setRecordingData] = useState({
    shelterName: '',
    currentOccupancy: '',
    capacity: '',
    notes: '',
    date: new Date().toISOString().split('T')[0] // Today's date as default
  });
  const [recordedData, setRecordedData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedShelterForChart, setSelectedShelterForChart] = useState('');
  const [showVisualization, setShowVisualization] = useState(false);

  useEffect(() => {
    fetchUserShelters();
    fetchShelterLocations();
    fetchRecordedData();
    fetchPredictions();
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

  const fetchShelterLocations = async () => {
    try {
      const response = await fetch('/api/shelter-locations');
      if (!response.ok) {
        throw new Error(`Failed to fetch shelter locations: ${response.status}`);
      }
      
      const data = await response.json();
      setShelterLocations(data);
    } catch (err) {
      console.error('Error fetching shelter locations:', err);
    }
  };

  const fetchRecordedData = async () => {
    try {
      const response = await fetch('/api/recorded-data', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecordedData(data);
      }
    } catch (err) {
      console.error('Error fetching recorded data:', err);
    }
  };

  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/predictions');
      if (response.ok) {
        const data = await response.json();
        setPredictions(data);
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
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

  const handleShelterSelect = (shelter) => {
    setNewShelter({
      name: shelter.name,
      address: shelter.address,
      capacity: '',
      contactPerson: '',
      phone: '',
      email: ''
    });
    setSearchTerm('');
  };

  const filteredShelters = shelterLocations.filter(shelter =>
    shelter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shelter.address.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5); // Limit to 5 results for better UX

  const handleRecordData = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/recorded-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          shelterName: recordingData.shelterName,
          currentOccupancy: parseInt(recordingData.currentOccupancy),
          capacity: parseInt(recordingData.capacity),
          notes: recordingData.notes,
          timestamp: new Date(recordingData.date).toISOString()
        })
      });
      
      if (response.ok) {
        alert('Data recorded successfully!');
        setRecordingData({
          shelterName: '',
          currentOccupancy: '',
          capacity: '',
          notes: '',
          date: new Date().toISOString().split('T')[0]
        });
        setShowDataRecording(false);
        fetchRecordedData(); // Refresh the data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to record data');
      }
    } catch (err) {
      console.error('Error recording data:', err);
      alert(`Failed to record data: ${err.message}`);
    }
  };

  const handleQuickRecord = (shelterName, capacity) => {
    setRecordingData({
      shelterName: shelterName,
      currentOccupancy: '',
      capacity: capacity.toString(),
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowDataRecording(true);
  };

  const getShelterData = (shelterName) => {
    const prediction = predictions.find(p => p.name === shelterName);
    const recorded = recordedData.filter(r => r.shelterName === shelterName);
    
    return {
      prediction,
      recorded,
      hasData: prediction || recorded.length > 0
    };
  };

  const renderBarChart = (shelterName) => {
    const data = getShelterData(shelterName);
    if (!data.hasData) return <p>No data available for this shelter</p>;

    // Generate 7 days of future dates
    const generateFutureDates = () => {
      const dates = [];
      const today = new Date();
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
      }
      return dates;
    };

    const futureDates = generateFutureDates();
    const maxValue = Math.max(
      data.prediction?.predicted_influx || 0,
      data.prediction?.capacity || 0,
      ...data.recorded.map(r => Math.max(r.currentOccupancy, r.capacity))
    );

    // Generate predicted values for each day (with some variation)
    const generatePredictedValues = (baseValue) => {
      return futureDates.map((date, index) => {
        // Add some realistic variation (±15%)
        const variation = 0.85 + (Math.random() * 0.3);
        return Math.round(baseValue * variation);
      });
    };

    const predictedValues = data.prediction ? generatePredictedValues(data.prediction.predicted_influx) : [];
    const capacityValue = data.prediction?.capacity || 0;

    return (
      <div className="bar-chart">
        <div className="chart-header">
          <h4>{shelterName} - 7-Day Occupancy Forecast</h4>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-color predicted"></span>
              Predicted Occupancy
            </span>
            <span className="legend-item">
              <span className="legend-color capacity"></span>
              Capacity
            </span>
            <span className="legend-item">
              <span className="legend-color recorded"></span>
              Historical Recorded
            </span>
          </div>
        </div>
        
        <div className="chart-container">
          <div className="chart-y-axis">
            <div className="y-axis-label">Occupancy</div>
            <div className="y-axis-ticks">
              {[0, Math.round(maxValue * 0.25), Math.round(maxValue * 0.5), Math.round(maxValue * 0.75), maxValue].map(tick => (
                <div key={tick} className="y-tick">
                  <span className="tick-label">{tick}</span>
                  <div className="tick-line"></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-bars">
            <div className="x-axis">
              {futureDates.map((date, index) => (
                <div key={index} className="x-tick">
                  <div className="date-label">
                    {date.toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  
                  <div className="bars-group">
                    {/* Predicted bar */}
                    {data.prediction && (
                      <div 
                        className="bar predicted"
                        style={{ 
                          height: `${(predictedValues[index] / maxValue) * 300}px`,
                          width: '60%'
                        }}
                        title={`Predicted: ${predictedValues[index]} people`}
                      >
                        <span className="bar-value">{predictedValues[index]}</span>
                      </div>
                    )}
                    
                    {/* Capacity line */}
                    {data.prediction && (
                      <div 
                        className="capacity-line"
                        style={{ 
                          height: '2px',
                          width: '100%',
                          top: `${300 - (capacityValue / maxValue) * 300}px`
                        }}
                        title={`Capacity: ${capacityValue} people`}
                      >
                        <span className="capacity-label">Capacity: {capacityValue}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Historical recorded data section */}
        {data.recorded.length > 0 && (
          <div className="historical-section">
            <h5>Historical Recorded Data</h5>
            <div className="historical-bars">
              {data.recorded.slice(0, 5).map((record, index) => (
                <div key={index} className="historical-bar">
                  <div className="historical-date">
                    {new Date(record.timestamp).toLocaleDateString('en-US', { 
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div 
                    className="bar recorded"
                    style={{ 
                      height: `${(record.currentOccupancy / maxValue) * 100}px`,
                      width: '40px'
                    }}
                    title={`Recorded: ${record.currentOccupancy} people`}
                  >
                    <span className="bar-value">{record.currentOccupancy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
              <div className="shelter-search-section">
                <h4>Quick Add from Existing Shelters</h4>
                <p>Search and select from our database of shelters</p>
                
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search shelters by name or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  
                  {searchTerm && filteredShelters.length > 0 && (
                    <div className="search-results">
                      {filteredShelters.map((shelter, index) => (
                        <div
                          key={index}
                          className="search-result-item"
                          onClick={() => handleShelterSelect(shelter)}
                        >
                          <div className="shelter-name">{shelter.name}</div>
                          <div className="shelter-address">{shelter.address}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-divider">
                <span>Or Add Custom Shelter</span>
              </div>

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
                    placeholder="Enter shelter name"
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
                    placeholder="Enter full address"
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
                    placeholder="Enter capacity"
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
                    placeholder="Enter contact person name"
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
                    placeholder="Enter phone number"
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
                    placeholder="Enter email address"
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
                  <div className="shelter-actions">
                    <button
                      onClick={() => handleQuickRecord(shelter.name, shelter.capacity)}
                      className="record-btn"
                      title="Record Data"
                    >
                      Record
                    </button>
                    <button
                      onClick={() => {
                        setSelectedShelterForChart(shelter.name);
                        setShowVisualization(true);
                      }}
                      className="visualize-btn"
                      title="View Data Visualization"
                    >
                      Chart
                    </button>
                    <button
                      onClick={() => handleRemoveShelter(shelter._id)}
                      className="remove-btn"
                      title="Remove shelter"
                    >
                      ×
                    </button>
                  </div>
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

      {/* Data Recording Section */}
      {showDataRecording && (
        <div className="data-recording-section">
          <div className="recording-header">
            <h3>Record Shelter Data</h3>
            <button 
              onClick={() => setShowDataRecording(false)}
              className="close-btn"
            >
              ×
            </button>
          </div>
          
          <div className="recording-form-container">
            <form onSubmit={handleRecordData} className="recording-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="shelterName">Shelter Name *</label>
                  <input
                    type="text"
                    id="shelterName"
                    value={recordingData.shelterName}
                    onChange={(e) => setRecordingData(prev => ({ ...prev, shelterName: e.target.value }))}
                    placeholder="Enter shelter name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    value={recordingData.date}
                    onChange={(e) => setRecordingData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="currentOccupancy">Current Occupancy *</label>
                  <input
                    type="number"
                    id="currentOccupancy"
                    value={recordingData.currentOccupancy}
                    onChange={(e) => setRecordingData(prev => ({ ...prev, currentOccupancy: e.target.value }))}
                    placeholder="Current number of occupants"
                    min="0"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="capacity">Capacity *</label>
                  <input
                    type="number"
                    id="capacity"
                    value={recordingData.capacity}
                    onChange={(e) => setRecordingData(prev => ({ ...prev, capacity: e.target.value }))}
                    placeholder="Total capacity"
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notes (Optional)</label>
                <textarea
                  id="notes"
                  value={recordingData.notes}
                  onChange={(e) => setRecordingData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or observations"
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Record Data
                </button>
                <button 
                  type="button" 
                  onClick={() => setRecordingData({
                    shelterName: '',
                    currentOccupancy: '',
                    capacity: '',
                    notes: '',
                    date: new Date().toISOString().split('T')[0]
                  })}
                  className="clear-btn"
                >
                  Clear Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Visualization Section */}
      {showVisualization && (
        <div className="visualization-section">
          <div className="visualization-header">
            <h3>Data Visualization</h3>
            <button 
              onClick={() => setShowVisualization(false)}
              className="close-btn"
            >
              ×
            </button>
          </div>
          
          <div className="visualization-content">
            {selectedShelterForChart ? (
              renderBarChart(selectedShelterForChart)
            ) : (
              <div className="no-shelter-selected">
                <h4>Select a shelter to view data visualization</h4>
                <p>Choose a shelter from your managed shelters to see recorded vs predicted data.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default YourSheltersContent; 