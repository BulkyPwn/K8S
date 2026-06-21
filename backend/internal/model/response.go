package model

import "time"

// Response 统一响应
type Response struct {
Code    int         `json:"code"`
Message string      `json:"message"`
Data    interface{} `json:"data,omitempty"`
}

func Success(data interface{}) Response {
return Response{Code: 0, Message: "ok", Data: data}
}

func Error(msg string) Response {
return Response{Code: 500, Message: msg}
}

// TimeFormat 时间格式化
func TimeFormat(t time.Time) string {
if t.IsZero() {
return ""
}
return t.Local().Format("2006-01-02 15:04:05")
}
