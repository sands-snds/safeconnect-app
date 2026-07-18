export const handleFormSubmit = (
    e,
    type,
    emergencyReports,
    assistanceRequests,
    setEmergencyReports,
    setAssistanceRequests,
    setShowModal
) => {
    const handleFormSubmit = (e, type) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        if (type === 'emergency') {
          const newReport = {
            id: emergencyReports.length + 1,
            reporter: formData.get('reporter'),
            phone: formData.get('phone'),
            emergency: formData.get('emergency'),
            severity: formData.get('severity'),
            location: formData.get('location'),
            description: formData.get('description'),
            date: formatDate(formData.get('date')),
            status: 'Received'
          };
          setEmergencyReports(prev => [...prev, newReport]);
          alert('Emergency report submitted successfully!');
        } else if (type === 'assistance') {
          const newRequest = {
            id: assistanceRequests.length + 1,
            requester: formData.get('requester'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            assistanceType: formData.get('assistanceType'),
            peopleAffected: parseInt(formData.get('peopleAffected')),
            location: formData.get('location'),
            description: formData.get('description'),
            date: formatDate(formData.get('date')),
            status: 'Pending'
          };
          setAssistanceRequests(prev => [...prev, newRequest]);
          alert('Assistance request submitted successfully!');
        }
        
        setShowModal(null);
      };
};