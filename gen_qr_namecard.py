"""
QR 명함 생성기 (vCard 직접 인코딩)
- 내국인용 / 외국인용 2종 QR 생성
- 사용법: 하단 정보 수정 후 python gen_qr_namecard.py 실행
- 필요 패키지: pip install qrcode pillow
"""

import qrcode

def make_clean_qr(data, filename):
    """라벨 없이 QR코드만 생성"""
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=12,
        border=2
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0B3D6B", back_color="white").convert('RGB')
    img.save(filename, quality=95)
    print(f"Saved: {filename}")


def generate_namecard_qr(info):
    """
    info dict 예시:
    {
        "name_ko": "김지수",
        "name_en_first": "Jisu",
        "name_en_last": "KIM",
        "org_ko": "한국공항공사 김해공항",
        "dept_ko": "총괄기획부",
        "org_en": "Korea Airports Corporation, Gimhae International Airport",
        "dept_en": "General Administration Department",
        "title_ko": "과장",
        "title_en": "Manager",
        "fn_ko": "한국공항공사(김해공항) 김지수 과장",
        "fn_en": "Jisu KIM (KAC Gimhae Airport)",
        "cell": "+82-10-2926-0505",
        "work": "+82-51-974-3709",
        "email": "jskim0425@airport.co.kr",
        "prefix": "KimJisu"   # 파일명 접미사
    }
    """
    vcard_kr = f"""BEGIN:VCARD
VERSION:3.0
N:{info['name_ko']};;;;
FN:{info['fn_ko']}
ORG:{info['org_ko']};{info['dept_ko']}
TITLE:{info['title_ko']}
TEL;TYPE=CELL:{info['cell']}
TEL;TYPE=WORK:{info['work']}
EMAIL;TYPE=WORK:{info['email']}
END:VCARD"""

    vcard_en = f"""BEGIN:VCARD
VERSION:3.0
N:{info['name_en_last']};{info['name_en_first']};;;
FN:{info['fn_en']}
ORG:{info['org_en']};{info['dept_en']}
TITLE:{info['title_en']}
TEL;TYPE=CELL:{info['cell']}
TEL;TYPE=WORK:{info['work']}
EMAIL;TYPE=WORK:{info['email']}
END:VCARD"""

    make_clean_qr(vcard_kr, f"QR_Korean_{info['prefix']}.png")
    make_clean_qr(vcard_en, f"QR_English_{info['prefix']}.png")


# ============================================================
# 아래 목록에 명함 정보 추가/수정 후 실행
# ============================================================

cards = [
    {
        "name_ko": "김지수",
        "name_en_first": "Jisu",
        "name_en_last": "KIM",
        "org_ko": "한국공항공사 김해공항",
        "dept_ko": "총괄기획부",
        "org_en": "Korea Airports Corporation, Gimhae International Airport",
        "dept_en": "General Administration Department",
        "title_ko": "과장",
        "title_en": "Manager",
        "fn_ko": "한국공항공사(김해공항) 김지수 과장",
        "fn_en": "Jisu KIM (KAC Gimhae Airport)",
        "cell": "+82-10-2926-0505",
        "work": "+82-51-974-3709",
        "email": "jskim0425@airport.co.kr",
        "prefix": "KimJisu"
    },
    {
        "name_ko": "최호주",
        "name_en_first": "Australia",
        "name_en_last": "CHOI",
        "org_ko": "한국공항공사 김해공항",
        "dept_ko": "운영계획부",
        "org_en": "Korea Airports Corporation, Gimhae International Airport",
        "dept_en": "Terminal Operations & Planning Department",
        "title_ko": "과장",
        "title_en": "Manager",
        "fn_ko": "한국공항공사(김해공항) 최호주 과장",
        "fn_en": "Australia CHOI (KAC Gimhae Airport)",
        "cell": "+82-10-4876-3082",
        "work": "+82-51-974-3344",
        "email": "chj3082@airport.co.kr",
        "prefix": "ChoiHoju"
    },
]

if __name__ == "__main__":
    for card in cards:
        print(f"\n--- {card['name_ko']} / {card['name_en_first']} {card['name_en_last']} ---")
        generate_namecard_qr(card)
    print("\nAll done!")
