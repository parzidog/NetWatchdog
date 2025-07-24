import psutil

def get_default_gateway():
    gateways = psutil.net_if_stats()
    gws = psutil.net_if_addrs()

    # Attempt to get the default gateway from psutil.net_if_stats()
    for interface, stats in gateways.items():
      if stats.isup and interface in gws:
          for addr in gws[interface]:
              print(addr.family.name)
              if addr.family.name == "AF_INET" and addr.address != "127.0.0.1":
                  return {"gateway_ip": addr.address}
    return {"gateway_ip": "Unavailable"}

# The function get_default_gateway is now available for import from this module.