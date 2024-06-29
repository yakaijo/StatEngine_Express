#https://steamcommunity.com/inventory/76561198104796633/730/2?l=english&count=5000
#Working steam inventory URL
from pymongo import MongoClient
import certifi
from flask import Flask, request
from flask_restful import Resource, Api
import requests
import json

app = Flask(__name__)
api = Api(app)

ca_cert_path = certifi.where()
client = MongoClient("mongodb+srv://mainuser:Z4zTd7YBor9Txrxm@csgo-database.l6hsda9.mongodb.net/test?retryWrites=true&w=majority&tlsCAFile=" + ca_cert_path)
db = client['test']
collection_name = db['users']

def fetch_inventory(steam_id):
    inventory_url = f"https://steamcommunity.com/inventory/{steam_id}/730/2?l=english&count=5000"
    response = requests.get(inventory_url)
    if response.status_code == 200:
        return response.json()
    else:
        return None
    
class UpdateInventory(Resource):
    def get(self):
        steam_id = request.args.get('steam_id')
        if not steam_id:
            return {"message": "Steam ID is required"}, 400

        inventory_data = fetch_inventory(steam_id)
        if inventory_data:
            items = inventory_data.get('descriptions', [])
            market_hash_names = [item.get('market_hash_name') for item in items if 'market_hash_name' in item]

            if market_hash_names:
                collection_name.update_one(
                    {"steamID": steam_id},
                    {"$set": {"inventory": market_hash_names}},
                    upsert=False
                )
                return {"message": f"Inventory of Steam ID {steam_id} has been updated in MongoDB."}, 200
            else:
                return {"message": "No items found in inventory to update."}, 400
        else:
            return {"message": "Failed to retrieve inventory or inventory is private"}, 404

api.add_resource(UpdateInventory, '/update_inventory')
"""
def print_market_hash_names(inventory_data):
    descriptions = inventory_data.get('descriptions', [])
    for item in descriptions:
        market_hash_name = item.get('market_hash_name')
        if market_hash_name:
            print(market_hash_name)

def main(steam_id):
    inventory_data = fetch_inventory(steam_id)
    if inventory_data:
        print_market_hash_names(inventory_data)
    else:
        print("Failed to retrieve inventory. The inventory may be private or the SteamID may be incorrect.")

# Replace 'STEAM_ID' with the actual SteamID of the user
main(76561198104796633)

"""