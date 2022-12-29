import boto3

# Set your AWS access keys as constants
AWS_ACCESS_KEY_ID = 'AKIA2SO5OU4DX7NOG2XX'
AWS_SECRET_ACCESS_KEY = 'SU7edBIdEBmrwYF/6fdwiMlwtKi/ZIJXWGV1QDFp'

# Create an S3 client using the access keys
s3 = boto3.client('s3',
                  aws_access_key_id=AWS_ACCESS_KEY_ID,
                  aws_secret_access_key=AWS_SECRET_ACCESS_KEY)

# Set the name of the bucket and the file you want to upload
bucket_name = 'area1alertsbucket'
file_name = 'data.txt'

# Set the string you want to upload
test_string = 'test ABC'

# Use the S3 client to upload the string to the bucket
try:
    # Use the S3 client to upload the string to the bucket
    s3.put_object(Bucket=bucket_name, Key=file_name, Body=test_string)

    print("String uploaded successfully to S3 bucket")

except Exception as e:
    # Print any errors that occurred
    print("Error uploading string to S3 bucket:", e)
