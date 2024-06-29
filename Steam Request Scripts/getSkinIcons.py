import requests
import time

BASE_URL = "https://steamcommunity.com/market/search/render/"
APP_ID = 730
ITEMS_PER_PAGE = 100  # Maximum allowed by the endpoint

def get_items(start, count):
    params = {
        "search_descriptions": 0,
        "sort_column": "default",
        "sort_dir": "desc",
        "appid": APP_ID,
        "norender": 1,
        "count": count,
        "start": start
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()
    return data

def get_all_icon_urls_and_hash_names():
    items_data = []
    start = 0

    while True:
        data = get_items(start, ITEMS_PER_PAGE)
        
        # Break loop if there are no items or if an error occurs
        if not data.get("success") or not data.get("results") or (data.get("total_count") == 0):
            print("Request failed, sleeping for 10 seconds before retrying")
            time.sleep(10)
            data = get_items(start, ITEMS_PER_PAGE)

        # Extract icon_url and hash_name from each item and append to the list
        for item in data["results"]:
            icon_url = item.get("asset_description", {}).get("icon_url")
            hash_name = item.get("asset_description", {}).get("market_hash_name")
            sell_price_text = item.get("sell_price")
            if icon_url and hash_name and sell_price_text:
                items_data.append((hash_name, icon_url, sell_price_text))
        print(data)
        print(start)

        # Check if there are more pages
        if data.get("start") + data.get("pagesize") >= data.get("total_count") and data.get("total_count") != 0:
            break

        # Move to the next page
        if data.get("total_count") != 0:
            start += ITEMS_PER_PAGE
        
        # Sleep for a short duration to not bombard the server with requests
        time.sleep(10)

    return items_data

def save_to_file(items_data, filename):
    with open(filename, 'w') as f:
        for market_hash_name, icon_url, sell_price_text in items_data:
            f.write(f"{market_hash_name},{icon_url},{sell_price_text}\n")

def main():
    items_data = get_all_icon_urls_and_hash_names()
    save_to_file(items_data, "csgo_skins_data.txt")

if __name__ == "__main__":
    main()
