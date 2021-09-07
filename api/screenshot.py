# Imports

## Flask Management
from flask import Flask, request, Response
from flask_compress import Compress
from flask_cors import CORS

## Initialization
app = Flask(__name__) # Flask
Compress(app) # Compressing the responses
CORS(app) # Enabling CORS globally

## Other Imports
from time import time
from traceback import print_exc
from constants import makeResponse, to_bool
from driver.chrome import Chrome
from uuid import uuid4

## Variable Initialization
LOCAL_CACHE = {} # store variable
CACHE_DURATION = 3 # in sec.

CHROME = None
PID = None

# Route Defining
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def hello(path):
    try:
        ## if the name of the file is in the following schema: [parameter].py
        # parameter = path[path.rfind("/") + 1:]

        # Cache Management

        ## Cache Key Defining
        _values_dict = request.values.to_dict()
        _values_dict.pop("_invalidate_cache", None)
        cache_key = str(_values_dict) + str(request.method)

        ## Cache Invalidation Management
        if "_invalidate_cache" in request.values:
            LOCAL_CACHE.pop(cache_key, None)
            return "Ok"

        if "preload" in request.values:
            global CHROME
            global PID
            if CHROME is not None:
                CHROME.close()
                CHROME.quit()
            CHROME = Chrome(width=request.values.get("width", 1920, int), height=request.values.get("height", 1080, int))
            PID = uuid4()
            return makeResponse({"pid": PID, "width": CHROME.width, "height": CHROME.height})

        if "loaded" in request.values:
            if CHROME is not None:
                return makeResponse({"pid": PID, "width": CHROME.width, "height": CHROME.height})
            else:
                return makeResponse({"pid": None, "width": None, "height": None})
        
        ## Cache Lookup
        try:
            if cache_key in LOCAL_CACHE:
                cache_duration = time() - LOCAL_CACHE[cache_key]["timestamp"]
                if cache_duration > CACHE_DURATION:
                    LOCAL_CACHE.pop(cache_key, None)
                else:
                    return Response(LOCAL_CACHE[cache_key]["data"], content_type=LOCAL_CACHE[cache_key]["type"], headers={"X-ANISE-CACHE": "HIT"})
        except:
            print_exc()
            print("[CACHE] An error occured while sending back the cached data")
            print("[FAILURE_RECOVERING] Processing the request as if nothing was cached")

        # Processing and Computation
        base64 = to_bool(request.values.get("base64", False))
        result = CHROME.screenshot(request.values.get("url", None), width=request.values.get("width", None, int), height=request.values.get("height", None, int), base64=base64) # the result should in this variable
        
        # Caching and Response
        LOCAL_CACHE[cache_key] = {"timestamp": time(), "data": result, "type": "application/json" if base64 else "image/png"}
        if base64:
            return makeResponse({"pid": PID, "width": CHROME.width, "height": CHROME.height, "result": result}, cache_hit=False)
        return Response(result, content_type="image/png", headers={"X-ANISE-CACHE": "MISS"})
    except:
        print_exc()
        print("[ERROR] An unknown error occured on the server and nothing could handle it. Sending back SERVER_ERROR (Status Code: 500)")
        return makeResponse({"message": "An error occured on the server"}, error="SERVER_ERROR", code=500)
