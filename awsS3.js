const { S3 } = require("aws-sdk");
const path = require('path');
const uuid = require('uuid').v4

exports.uploadS3 = async (req) => {
    const s3 = new S3();

    const params = req.files.map((file) => {
        return {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: req.body.email + '-'+ req.body.name + '-' + uuid() + path.extname(file.originalname),
            Body: file.buffer
        }
    }) 

    return await Promise.all(params.map((param) => s3.upload(param).promise()))
}

exports.getUploads = async () => {
    const s3 = new S3();

    const param = {
        Bucket: process.env.AWS_BUCKET_NAME,
    }

    return await s3.listObjects(param).promise();
}