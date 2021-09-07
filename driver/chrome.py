from os import makedirs
from subprocess import check_output
from brotli import decompress
from os.path import abspath, dirname, exists
from uuid import uuid4

import pyuseragents
from selenium import webdriver

_CHROMIUM_PATH = abspath(dirname(dirname(__file__))) + "/bin/chromium.br"
CHROMIUM_PATH = abspath(dirname(dirname(__file__))) + "/bin/chromium"
print("Chromium path:", CHROMIUM_PATH)
if not exists(CHROMIUM_PATH):
    with open(_CHROMIUM_PATH, "rb") as comp_chrome_file:
        with open(CHROMIUM_PATH, "wb") as chrome_file:
            chrome_file.write(decompress(comp_chrome_file.read()))
#CHROMIUM_PATH = check_output(["node", "driver/path.js"]).decode("utf-8").replace("\n", "")
#with open("./bin/path") as path_file:
#    CHROMIUM_PATH = path_file.read()
#CHROMIUM_PATH = "/tmp/chromium"
CHROMEDRIVER_PATH = abspath(dirname(dirname(__file__))) + "/bin/chromedriver"


class Chrome():
    def __init__(self, width: int = 1920, height: int = 1080) -> None:
        print("Initializing Chrome Object")
        self._width = int(width)
        self._height = int(height)
        self.chromium = str(CHROMIUM_PATH)
        self.chromedriver = str(CHROMEDRIVER_PATH)

        print("Creating temp folders")
        self._tmp_folder = '/tmp/{}'.format(uuid4())

        for folder in ["", "/user-data", "/data-path", "/cache-dir"]:
            if not exists(self._tmp_folder + str(folder)):
                makedirs(self._tmp_folder + str(folder))

        print("Defining the options")
        self.options = webdriver.ChromeOptions()
        for option in [
            '--headless',
            '--no-sandbox',
            '--disable-gpu',
            '--user-data-dir={}'.format(self._tmp_folder + '/user-data'),
            '--enable-logging',
            '--log-level=0',
            '--v=99',
            '--single-process',
            '--hide-scrollbars',
            '--data-path={}'.format(self._tmp_folder + '/data-path'),
            '--ignore-certificate-errors',
            '--homedir={}'.format(self._tmp_folder),
            '--disk-cache-dir={}'.format(self._tmp_folder + '/cache-dir'),
            'user-agent={}'.format(pyuseragents.random())
        ]:
            self.options.add_argument(option)

        print("Setting the Chromium Binary Location")
        self.options.binary_location = self.chromium

        print("Launching the driver")
        self.driver = webdriver.Chrome(options=self.options, executable_path=self.chromedriver)

    @property
    def width(self):
        print("Getting the width")
        _window_size = self.driver.get_window_size()
        print("Window size:", _window_size)
        self._width = int(_window_size.get("width", -1))
        self._height = int(_window_size.get("height", -1))
        return self._width

    @width.setter
    def width(self, width: int):
        if width is None:
            return
        print("Setting the width")
        self.driver.set_window_size(width, self._height)
        self._width = int(width)

    @property
    def height(self):
        print("Getting the height")
        _window_size = self.driver.get_window_size()
        print("Window size:", _window_size)
        self._width = int(_window_size.get("width", -1))
        self._height = int(_window_size.get("height", -1))
        return self._height

    @height.setter
    def height(self, height: int):
        if height is None:
            return
        print("Setting the height")
        self.driver.set_window_size(self._width, height)
        self._height = int(height)

    def open(self, url: str = None):
        if url is None:
            return
        print("Opening a new URL")
        self.driver.get(str(url))

    def close(self):
        print("Closing the driver")
        self.driver.close()

    def quit(self):
        print("Quitting the driver")
        self.driver.quit()

    def screenshot(self, url: str = None, width: int = None, height: int = None, base64: bool = False):
        self.open(url)
        self.width = width
        self.height = height
        if base64:
            print("Screenshotting as base64")
            return self.driver.get_screenshot_as_base64()
        else:
            print("Screenshotting as PNG")
            return self.driver.get_screenshot_as_png()

    def fullpage_screenshot(self, url: str = None, width: int = None, base64: bool = False):
        self.width = width
        self.open(url)
        _height = self.height
        self.height = self.get_page_height(url)
        if base64:
            print("Full page screenshotting as base64")
            screenshot = self.driver.get_screenshot_as_base64()
        else:
            print("Full page screenshotting as PNG")
            screenshot = self.driver.get_screenshot_as_png()
        self.height = _height
        return screenshot
    
    def source(self, url: str = None):
        self.open(url)
        print("Getting the page source code")
        return self.driver.page_source

    def get_page_height(self, url: str = None):
        self.open(url)
        print("Getting the page height")
        return int(self.driver.execute_script("return Math.max( document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight )"))