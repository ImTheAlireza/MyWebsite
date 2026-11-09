#!/usr/bin/env python3
"""tools/make-titlecard-reel.py — regenerate assets/showreel-titlecard.mp4

The hero needs an actual video file to play before the owner uploads a real cut.
This builds a short, honest title card: his name, his role and a moving marker.
It contains no stock footage and no invented case-study footage, so nothing on
the site claims work that does not exist.

Replace it from the admin panel (Hero → Reel file) with the real showreel.

Requires ffmpeg with libx264 and a TTF font. On a machine without ffmpeg the
script explains what to do instead of writing a broken file.
"""
import shutil
import subprocess
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'showreel-titlecard.mp4'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'

FILTER = (
    "drawgrid=w=64:h=64:t=1:c=0x1b1b21@0.55,"
    "drawbox=x=64:y=64:w=1152:h=592:color=0x0a0a0c@0.82:t=fill,"
    "drawbox=x=64:y=64:w=1152:h=592:color=0x2a2a32@1:t=1,"
    f"drawtext=fontfile={FONT}:text='ALIREZA SHABANZADEH':fontcolor=0xffffff:fontsize=62:"
    "x=(w-text_w)/2:y=252:alpha='if(lt(t,0.6),0,min(1,(t-0.6)/0.9))',"
    f"drawtext=fontfile={FONT}:text='MOTION DESIGNER  ·  PRODUCT & UI MOTION':fontcolor=0xff5c35:fontsize=24:"
    "x=(w-text_w)/2:y=340:alpha='if(lt(t,1.1),0,min(1,(t-1.1)/0.9))',"
    f"drawtext=fontfile={MONO}:text='SHOWREEL':fontcolor=0x8a8a92:fontsize=18:"
    "x=(w-text_w)/2:y=372:alpha='if(lt(t,1.6),0,min(1,(t-1.6)/0.9))',"
    "drawbox=x=464:y=436:w=352:h=1:color=0x302f38@1:t=fill,"
    "drawbox=x=464:y=436:w='352*min(t/3,1)':h=1:color=0xff5c35@1:t=fill,"
    f"drawtext=fontfile={MONO}:text='16\\:9  ·  24 fps':fontcolor=0x5f5f68:fontsize=16:"
    "x=w-text_w-92:y=64+552,"
    "fade=t=in:st=0:d=0.5,fade=t=out:st=8.4:d=0.6"
)


def main():
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        print('ffmpeg not found. Install it, or upload a real reel from the admin panel.')
        return 1
    if not pathlib.Path(FONT).exists():
        print('Missing font:', FONT)
        return 1
    cmd = [
        ffmpeg, '-y', '-hide_banner', '-loglevel', 'error',
        '-f', 'lavfi', '-i', 'color=c=0x0a0a0c:s=1280x720:d=9:r=30',
        '-vf', FILTER,
        '-t', '9', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
        '-crf', '27', '-preset', 'veryslow', '-movflags', '+faststart', '-an',
        str(OUT),
    ]
    subprocess.run(cmd, check=True)
    print('wrote', OUT.relative_to(ROOT), OUT.stat().st_size, 'bytes')
    return 0


if __name__ == '__main__':
    sys.exit(main())
