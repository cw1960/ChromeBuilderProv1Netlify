// Function to fetch project data
const fetchProject = async (projectId: string) => {
  try {
    console.log('Fetching project data for:', projectId);
    // Use the direct endpoint to bypass middleware
    const response = await fetch(`/api/projects/direct-get-project?projectId=${projectId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching project:', errorData);
      throw new Error(errorData.message || 'Failed to fetch project');
    }
    
    const data = await response.json();
    console.log('Project data fetched successfully:', data.project.name);
    return data.project;
  } catch (error) {
    console.error('Error in fetchProject:', error);
    throw error;
  }
};

// Function to create a new conversation
const createConversation = async (projectId: string) => {
  try {
    console.log('Creating new conversation for project:', projectId);
    // Use the direct endpoint to bypass middleware
    const response = await fetch('/api/conversations/direct-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error creating conversation:', errorData);
      throw new Error(errorData.message || 'Failed to create conversation');
    }
    
    const data = await response.json();
    console.log('Conversation created successfully:', data.conversation.id);
    return data.conversation;
  } catch (error) {
    console.error('Error in createConversation:', error);
    throw error;
  }
}; 