import sys
try:
    from art import *
except ImportError:
    print("art 라이브러리가 설치되어 있지 않습니다. 터미널에서 'pip install art'를 실행해주세요.")
    sys.exit(1)

def main():
    # 기본 텍스트는 "Python" 이지만, 실행할 때 텍스트를 입력받을 수 있습니다.
    text = "Python"
    if len(sys.argv) > 1:
        text = " ".join(sys.argv[1:])
    
    print("=" * 50)
    print("🎨 ASCII Art Generator 🎨")
    print("=" * 50)
    
    # 'block' 폰트를 사용하여 텍스트 출력
    tprint(text, font="block")
    
    print("\n오늘도 즐거운 코딩 하세요! ", end="")
    aprint("happy")
    print("=" * 50)

if __name__ == "__main__":
    main()
