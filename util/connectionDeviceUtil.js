const connectDevice = async (device) => {
  try {
    // const response = await fetch('https://apiw.looyal.id/v3/wooblazz/connect_new_api', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json;charset=UTF-8'
    //   },
    //   body: JSON.stringify({
    //     number: device
    //   })
    // });

    // const result = await response.json();
    // return result;
  } catch (error) {
    throw new Error('An error occurred');
  }
};

const disconnectDevice = async (device) => {
  try {
    // const response = await fetch('https://apiw.looyal.id/v3/wooblazz/disconnect_new_api', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json;charset=UTF-8'
    //   },
    //   body: JSON.stringify({
    //     number: device
    //   })
    // });

    // const result = await response.json();
    // return result;
  } catch (error) {
    throw new Error('An error occurred');
  }
};

module.exports = {disconnectDevice, connectDevice};
