from os import listdir
from os.path import isfile, join
onlyfiles = [f[:-4] for f in listdir('./') if isfile(join('./', f))][1:]
print 'var catalog = {'
for file in onlyfiles:
    print "    '"+file+"': {name: '"+file[:-1].title()+"', url: 'sounds/"+file+".wav', icon: 'images/"+file[:-1]+".png', buffer: null},"
print '};'