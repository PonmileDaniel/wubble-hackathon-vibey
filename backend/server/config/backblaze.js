import axios from "axios";
import dotenv from "dotenv";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getAwsSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config(); // Load .env variables

const keyId = process.env.B2_KEY_ID;
const appKey = process.env.B2_APPLICATION_KEY;
const apiUrl = process.env.BACKBLAZE_URL

// Function to authorize with B2
export const b2 = async () => {
  try {
    const response = await axios.get(`${apiUrl}/b2_authorize_account`, {
      auth: { username: keyId, password: appKey },
    });

    return {
      apiUrl: response.data.apiUrl,
      authToken: response.data.authorizationToken,
      downloadUrl: response.data.downloadUrl,
      accountId: response.data.accountId,
    };
  } catch (error) {
    console.error("B2 Authorization Failed:", error.response?.data || error.message);
    throw error;
  }
};



export const getUploadUrl = async (bucketId) => {
    try {
      const { apiUrl, authToken } = await b2();
      const response = await axios.post(
        `${apiUrl}/b2api/v2/b2_get_upload_url`,
        { bucketId },
        {
          headers: {
            Authorization: authToken,
          },
        }
      );
  
      return response.data; // Contains upload URL and authorization token
    } catch (error) {
      console.error("Failed to get upload URL:", error.response?.data || error.message);
      throw error;
    }
};


export const deleteFile = async (fileUrl) => {
  try {
    // First we need to get the file info to get the fileid
    const { apiUrl, authToken } = await b2();

    // Extract the file name from the URL
    const fileName = fileUrl.replace(/^https?:\/\/[^/]+\/file\/[^/]+\//, '');

    // List file version to get the filedId
    const listFilesResponse = await axios.post(
      `${apiUrl}/b2api/v2/b2_list_file_names`,{
        bucketId: process.env.B2_BUCKET_ID,
        prefix: fileName,
        maxFileCount: 1
      },
      {
        headers: {
          Authorization: authToken
        }
      }
    );
    if (listFilesResponse.data.files && listFilesResponse.data.files.length > 0) {
      const fileId = listFilesResponse.data.files[0].fileId;

      //Now delete the file using fileId
      const deleteResponse = await axios.post(
        `${apiUrl}/b2api/v2/b2_delete_file_version`,
        {
          fileName: fileName,
          fileId: fileId
        },
        {
          headers: {
            Authorization: authToken
          }
        }
      );
      console.log('File deleted successfully:', fileName);
      return deleteResponse.data
    } else{
      console.warn('File not found in B2:', fileName);
      return null; //File does not exist
    }
  } catch (error) {
    console.error('Error deleting from B2:', error.response?.data || error.message);
    throw error;
  }
}



export const getSignedUrl = async (fileName, validDurationInSeconds = 43200) => { // Increased default duration
  try {
    const endpoint = process.env.B2_S3_ENDPOINT;
    const region = process.env.B2_S3_REGION;
    const bucketName = process.env.B2_BUCKET_NAME;
    const keyId = process.env.B2_KEY_ID;
    const appKey = process.env.B2_APPLICATION_KEY;

    if (!endpoint || !region || !bucketName || !keyId || !appKey) {
      console.error("Missing B2 S3 configuration environment variables");
      throw new Error("Missing B2 S3 configuration environment variables");
    }

    // Configure the S3 client to use B2's S3 endpoint
    const s3Client = new S3Client({
      endpoint: `https://${endpoint}`, // Make sure to include https://
      region: region,
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: appKey,
      },
    });

    // Create the command for getting an object
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName, // fileName should be the object key (path within the bucket)
    });

    // Generate the pre-signed URL
    const signedUrl = await getAwsSignedUrl(s3Client, command, {
      expiresIn: validDurationInSeconds, // Duration in seconds
    });

    return signedUrl;

  } catch (error) {
    console.error("Failed to generate AWS SDK signed URL for B2:", error);
    return null; // Or throw error; depending on how you want to handle failures
  }
};

