from flask import render_template as rt

def render_template(path, **kwargs):
    print(kwargs)
    return rt(path + ".html", css = path.split('/')[-1] + ".css", **kwargs)