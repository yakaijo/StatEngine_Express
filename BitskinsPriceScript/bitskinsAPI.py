from datetime import datetime
import requests
import json
from pymongo import MongoClient
import certifi

ca_cert_path = certifi.where()
auth_key = ''

headers = {'x-apikey': auth_key}
res = requests.get('https://api.bitskins.com/market/skin/730', headers=headers)
response = json.loads(res.text)

# Connect to the MongoDB instance
client = MongoClient("mongodb://localhost:27017")  # Adjust this if your MongoDB instance is elsewhere
db = client['testdb']  # Name of the database
collection = db['itemData']  # Name of the collection

for item in response:
    name = item['name']
    price = item['suggested_price']
    bson_timestamp = datetime.utcnow()
    # Inserting data into the collection
    existing_item = collection.find_one({"name": name, "suggested_price": None, "timestamp": bson_timestamp})
    
    if existing_item and price != None:
        # Update the price for the existing item
        collection.update_one({"name": name}, {"$set": {"suggested_price": price, "timestamp": bson_timestamp}})
    else:
        # Insert new item into the collection
        if price != None:
            collection.insert_one({"name": name, "suggested_price": price, "timestamp": bson_timestamp})

print("Data inserted successfully!")
