import psutil

def get_default_gateway_info():
    print("Running get_default_gateway_info...")
    gateways = psutil.net_if_addrs()
    for iface, addrs in gateways.items():
        for addr in addrs:
            if addr.family.name == 'AF_INET' and not addr.address.startswith("127."):
                return {"gateway_ip": addr.address}
    return {"gateway_ip": "Unavailable"}
