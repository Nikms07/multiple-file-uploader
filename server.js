require('dotenv').config();
const express = require('express');
const compression = require('compression');
const multer = require('multer');
const { getUploads, uploadS3 } = require('./awsS3');

const app = express();
app.use(compression());
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const fileFilter = function (req, file, callback) {
    if (file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'video/mp4') {
        callback(null, true)
    }
    else {
        callback(new Error('Only jpg, png, jpeg, mp4 files allowed'), false)
    }
}
// const storage= multer.diskStorage({
//     destination: function(req, file, callback){
//         if (!fs.existsSync(__dirname + '/uploads'))
//         fs.mkdirSync(__dirname + '/uploads')
//         callback(null, 'uploads/');
//     },
//     filename:function(req, file, callback){
//         callback(null, req.body.email + '-'+ req.body.name + '-' + Date.now() + path.extname(file.originalname));
//     }
// });

const storage = multer.memoryStorage();

let recentUploads = []

const upload = multer({
    storage,
    fileFilter
});

app.post('/upload', upload.array('files', 20), async (req, res) => {

    try {
        const results = await uploadS3(req);
        recentUploads = results.map(result => `http://s3.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${result.Key}`)
        return res.json({
            result: 'Success',
            message: 'Files Uploaded Succesfully',
            recent: results.map(result => `http://s3.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${result.Key}`)
        })
    }
    catch (err) {
        console.log(err)
    }

});

app.get('/', async (req, res) => {

    const data = await getUploads();
    const allUploads = data.Contents.map(content => `http://s3.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${content.Key}`)
    res.render('index', { all: allUploads });
})

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.json({
            result: 'Failure',
            message: err.message,
            recent: recentUploads
        })
    }
    else if (err) {
        return res.json({
            result: 'Failure',
            message: err.message,
            recent: recentUploads
        })
    }
})

const port = process.env.PORT || 4000
app.listen(port, () => {
    console.log(`server running on port ${port}...`);
})
