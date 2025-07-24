import asyncio
import socket
import ipaddress
from .gateway import get_default_gateway

COMMON_PORTS = [22, 80, 443, 3389]  # Extend as needed

async def scan_port(ip, port):
    try:
        conn = asyncio.open_connection(ip, port)
        reader, writer = await asyncio.wait_for(conn, timeout=0.5)
        writer.close()
        await writer.wait_closed()
        return port
    except:
        return None

async def scan_host(ip):
    tasks = [scan_port(ip, port) for port in COMMON_PORTS]
    open_ports = await asyncio.gather(*tasks)
    open_ports = [port for port in open_ports if port is not None]
    if open_ports:
        return {"ip": ip, "open_ports": open_ports}
    return None

async def scan_network_async(gateway_ip):
    gateway_info = get_default_gateway()
    gateway_ip = gateway_info["gateway_ip"]
    network = ipaddress.ip_network(f"{gateway_ip}/24", strict=False)
    hosts = [str(host) for host in network.hosts()]
    semaphore = asyncio.Semaphore(500)  # Limit concurrent tasks

    async def sem_scan(ip):
        async with semaphore:
            return await scan_host(ip)

    tasks = [sem_scan(ip) for ip in hosts]
    results = await asyncio.gather(*tasks)
    results = [r for r in results if r]

    return {
        "host_count": len(hosts),
        "results": results
    }

def scan_network():
    gateway_info = get_default_gateway()
    gateway_ip = gateway_info["gateway_ip"]
    return asyncio.run(scan_network_async(gateway_ip))

