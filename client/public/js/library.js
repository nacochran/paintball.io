/*  */

async function sendPostRequest(endpoint) {
  try {
    const response = await fetch(`/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    return response;
  } catch (error) {
    console.error('Error sending POST request:', error);
  }
}
