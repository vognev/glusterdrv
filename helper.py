from gluster import gfapi
from sys import argv
import errno

_, servers, volume, subdir = argv

volume = gfapi.Volume(servers.split(','), volume)
volume.mount()

try:
  volume.makedirs(subdir, 493) #0o755
except OSError as e:
  if not errno.EEXIST == e.errno:
    raise e

volume.umount()
