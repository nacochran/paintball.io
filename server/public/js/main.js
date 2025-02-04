/*  */

async function sendPostRequest(endpoint) {
  try {
    const response = await fetch(`http://localhost:5000/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (response.redirected) {
      window.location.href = response.url;
    } else if (!response.ok) {
      console.error('Failed to send POST request:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending POST request:', error);
  }
}
