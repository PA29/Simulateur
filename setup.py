from cx_Freeze import setup, Executable
import sys,os

os.environ['TCL_LIBRARY'] = r'C:/Users/Tanguy/Anaconda3/tcl/tcl8.6'
os.environ['TK_LIBRARY'] = r'C:/Users/Tanguy/Anaconda3/tcl/tcl8.6'

#os.environ['TCL_LIBRARY']=r'C:/Programs/Python/Python35/tcl/tcl8.6'
#os.environ['TK_LIBRARY']=r'C:/Programs/Python/Python35/tcl/tk8.6'

#includes = ["http.server", "socketserver", "sqlite3", "threading"]
includes = ["flask", "sqlite3", "tkinter"]
excludes = []
packages = ["encodings", "asyncio", "jinja2", "numpy", "tkinter"]
include_files = ["C:/Users/Tanguy/Anaconda3/DLLs/tcl86t.dll", "C:/Users/Tanguy/Anaconda3/DLLs/tk86t.dll"]

setup(name="main",
      version="1.1",
      description="Description of the app here.",
      authors="PA29 - ECL",
      options={"build_exe":{"includes":includes, "excludes":excludes, "packages":packages, "include_files":include_files}},
      executables=[Executable("spaghetti.py")]) #base="Win32GUI"