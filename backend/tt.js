import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const B2_AUTH_URL = 'https://api.backblazeb2.com/b2api/v2/b2_authorize_account';

async function authorizeB2() {
  try {
    const keyId = process.env.B2_KEY_ID;
    const appKey = process.env.B2_APPLICATION_KEY;

    if (!keyId || !appKey) {
      throw new Error('Missing B2 credentials');
    }

    const auth = Buffer.from(`${keyId}:${appKey}`).toString('base64');

    const response = await axios.get(B2_AUTH_URL, {
      headers: {
        Authorization: `onst { limit = 10 } = req.query;Basic ${auth}`
      }
    });

    console.log('✅ Authorized B2 successfully');
    return response.data; // returns {authorizationToken, apiUrl, downloadUrl, accountId, ...}
  } catch (error) {
    console.error('❌ Error authorizing B2:', error.response?.data || error.message);
    throw error;
  }
}

async function listBucketFiles(authData) {
  try {
    const { authorizationToken, apiUrl } = authData;
    const bucketId = process.env.B2_BUCKET_ID;

    const response = await axios.post(
      `${apiUrl}/b2api/v2/b2_list_file_names`,
      {
        bucketId,
        maxFileCount: 10, // or whatever
      },
      {
        headers: {
          Authorization: authorizationToken
        }
      }
    );

    console.log('✅ Files listed successfully');
    console.log(response.data.files);
  } catch (error) {
    console.error('❌ Error listing files:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  const authData = await authorizeB2();
  await listBucketFiles(authData);
}

main();
