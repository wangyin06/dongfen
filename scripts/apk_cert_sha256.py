from __future__ import annotations

import hashlib
import struct
import sys
from pathlib import Path

MAGIC = b"APK Sig Block 42"
V2_ID = 0x7109871A


def read_u32(data: bytes, offset: int) -> tuple[int, int]:
    return struct.unpack_from("<I", data, offset)[0], offset + 4


def read_u64(data: bytes, offset: int) -> tuple[int, int]:
    return struct.unpack_from("<Q", data, offset)[0], offset + 8


def length_prefixed(data: bytes, offset: int) -> tuple[bytes, int]:
    length, offset = read_u32(data, offset)
    end = offset + length
    if end > len(data):
        raise ValueError("length overrun")
    return data[offset:end], end


def extract_v2_cert(apk: bytes) -> bytes:
    eocd = apk.rfind(b"PK\x05\x06")
    if eocd < 0:
        raise ValueError("no EOCD")
    cd_offset = struct.unpack_from("<I", apk, eocd + 16)[0]
    block_end = cd_offset
    if apk[block_end - 16 : block_end] != MAGIC:
        raise ValueError("no APK Signing Block")
    size, _ = read_u64(apk, block_end - 24)
    block_start = block_end - 8 - size
    offset = block_start + 8
    while offset < block_end - 24:
        pair_len, offset = read_u64(apk, offset)
        pair_id, offset = read_u32(apk, offset)
        value_len = pair_len - 4
        value = apk[offset : offset + value_len]
        offset += value_len
        if pair_id == V2_ID:
            break
    else:
        raise ValueError("no v2 signature")

    signers, _ = length_prefixed(value, 0)
    signer, _ = length_prefixed(signers, 0)
    signed_data, offset = length_prefixed(signer, 0)
    # Signatures and public key follow; the first certificate is in signed data.
    digests, offset = length_prefixed(signed_data, 0)
    certificates, offset = length_prefixed(signed_data, offset)
    certificate, _ = length_prefixed(certificates, 0)
    return certificate


def main(path: Path) -> int:
    cert = extract_v2_cert(path.read_bytes())
    print(f"cert_der_bytes: {len(cert)}")
    print(f"cert_sha256: {hashlib.sha256(cert).hexdigest()}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: apk_cert_sha256.py <apk>")
    sys.exit(main(Path(sys.argv[1])))