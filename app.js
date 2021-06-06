const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridFs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

const app = express();


// Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine','ejs');

// Mongo URI
const mongoURI = 
            'mongodb+srv://grp:grp@files.pd8sa.mongodb.net/test';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

conn.once('open', () => {
    // Init stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    
});



// Create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex');// + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            metadata: {
                originalname: file.originalname,
            },
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });


// @route Get '/'
// @desc Loads form
app.get('/',(req,res) => {
    res.render('index');
});

// @route POST '/upload'
// @desc Uploads file to DB
app.post('/upload', upload.single('file'), (req, res) => {
    //res.json({file: req.file});
    res.redirect('/MyFiles');
});

// @route GET '/files'
// @desc Display all files in JSON
app.get('/MyFiles', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        // Check if files
    if (!files || files.length === 0) {
        res.render('index', { files: false });
      } else {
        files.map(file => {
            switch(file.contentType)
            {
                case 'image/jpeg' :
                case 'image/png':
                case "image/webp":
                    file.type = "image";
                    break;
                case "application/pdf" :
                    file.type = "pdf";
                    break;
                case "application/x-zip-compressed" :
                case "application/x-bzip":
                case "application/x-bzip2":
                case "application/x-rar-compressed":
                case "application/zip":
                case "application/x-7z-compressed":
                    file.type = "zip";
                    break;
                case "application/msword":
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                    file.type = "doc";
                    break;
                case "application/vnd.ms-powerpoint":
                case "application/vnd.oasis.opendocument.presentation":
                case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                    file.type = "ppt";
                    break;
                case "audio/mpeg":
                case "audio/aac":
                case "audio/ogg":
                case "audio/webm":
                    file.type = "audio";
                    break;
                case "application/vnd.oasis.opendocument.text":
                case "text/plain":
                    file.type = "txt";
                    break;
                case "application/x-msdownload":
                    file.type = "app";
                    break;
                case "application/vnd.oasis.opendocument.spreadsheet":
                case "text/csv":
                case "application/vnd.ms-excel":
                case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    file.type = "excel";
                    break;
                case "text/css":
                    file.type = "css";
                    break;
                case "image/gif":
                    file.type="gif";
                    break;
                case "text/html":
                    file.type="html";
                    break;
                case "application/java-archive":
                    file.type="jar";
                    break;
                case "application/javascript":
                case "text/javascript":
                case "application/json":
                    file.type="js";
                    break;
                case "video/ogg":
                case "video/mpeg":
                case "video/webm":
                    file.type="video";
                    break;
                case "application/xml":
                case "application/vnd.mozilla.xul+xml":
                case "application/xhtml+xml":
                    file.type="xml";
                    break;
                    
            }
          
        });
        res.render('index', { files: files });
      }
    });
    
});

// @route GET '/MyFiles/:filename'
// @desc Display single file object
app.get('/MyFiles/:filename', (req, res) => {
    gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        if(!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }
    
        // file exists
        // Read output to browser
        const readstream = gfs.createReadStream(file.filename);
        //readstream.pipe(res);
        //window.open(res);
        readstream.on('open', function () {
            // This just pipes the read stream to the response object (which goes to the client)
            readstream.pipe(res);
          });

    });
    
});

// @route DELETE /MyFiles/:id
// @desc  Delete file
app.delete('/MyFiles/:id', (req, res) => {
    gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
      if (err) {
        return res.status(404).json({ err: err });
      }
  
      res.redirect('/MyFiles');
    });
  });

const port = 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));