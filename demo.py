def hello_world():
    print("Hello World!")
    return "success"

class Calculator:
    def __init__(self):
        self.value = 0
    
    def add(self, num):
        self.value += num
        return self.value
    
    def multiply(self, num):
        self.value *= num
        return self.value

# 这是一个注释
if __name__ == "__main__":
    calc = Calculator()
    calc.add(5)    
    calc.multiply(2)
    print(f"Result: {calc.value}")