const processNextRequest = async () => {
    if (requestQueue.length === 0) {
      // No more requests in the queue, reset the processing flag
      isProcessing = false;
      return;
    }
  
    const { req, res } = requestQueue.shift(); // Remove the first request from the queue
  
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });
  
    if (!errors.isEmpty()) {
      res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    } else {
      // Your existing logic here to handle the request data
      var number = req.body.number;
      var to = req.body.to;
      var type = req.body.type;
      var msg = req.body.message;
      var urlni = req.body.urlni;
      var filename = req.body.filename;
      var longitude = req.body.longitude;
      var latitude = req.body.latitude;
      var array = req.body.array;
      var array_fil = req.body.array_fill;
  
      if (!fs.existsSync(path.concat(number))) {
        res.status(401).json({
          status: false,
          message: 'Please scan the QR before using the API',
        });
      } else {
        const files = fs.readdirSync(path.concat(number));
        if (files.length > 5) {
          try {
            await con.gas(
              msg,
              number,
              to,
              type,
              urlni,
              filename,
              longitude,
              latitude,
              array,
              array_fil
            );
  
            res.status(200).json({
              status: true,
              message: 'success',
            });
          } catch (error) {
            res.status(401).json({
              status: false,
              message: error.message,
            });
          }
        } else {
          res.status(401).json({
            status: false,
            message: 'Files not found or insufficient files',
          });
        }
      }
    }
  
    // After processing this request, process the next request in the queue
    processNextRequest();
};
module.exports = { processNextRequest };
  