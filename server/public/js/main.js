

/* 
 * AJAX Library
 * Eventually expand this into a class
 * Add functionality to disable a specific event/button until request returns
 */
async function sendPostRequest(endpoint) {
  try {
    const response = await fetch(`/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    console.log(result);

    return result;
  } catch (error) {
    console.error('Error sending POST request:', error);
  }
}
