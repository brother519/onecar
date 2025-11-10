package utils

import "encoding/json"

// ToJSONString 将对象转换为JSON字符串
func ToJSONString(v interface{}) string {
	bytes, err := json.Marshal(v)
	if err != nil {
		return ""
	}
	return string(bytes)
}

// FromJSONString 从JSON字符串解析对象
func FromJSONString(str string, v interface{}) error {
	return json.Unmarshal([]byte(str), v)
}
