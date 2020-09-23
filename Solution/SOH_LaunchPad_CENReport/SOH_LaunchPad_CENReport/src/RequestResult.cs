using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SOH_LaunchPad_CENReport
{
    public class RequestResult
    {
        public ResultStatus Status;

        public string Data;
        public string Errmsg;

        public RequestResult()
        {
            Status = ResultStatus.Success;
        }

        public enum ResultStatus
        {
            Success = 1,
            Failure = 0
        }

        public RequestResult(ResultStatus status)
        {
            Status = status;
        }

        public static RequestResult Error(string msg)
        {
            return Create(ResultStatus.Failure, null, msg);
        }


        public static RequestResult Error(string data, string msg)
        {
            return Create(ResultStatus.Failure, data, msg);
        }

        public static RequestResult Ok(object data)
        {
            string json = JsonConvert.SerializeObject(data);
            return Create(ResultStatus.Success, json, "ok");
        }


        public static RequestResult Ok(string data)
        {
            return Create(ResultStatus.Success, data, "ok");
        }

        public static RequestResult Ok()
        {
            return Create(ResultStatus.Success, "{}", "");
        }

        public static RequestResult Ok(string data, string msg)
        {
            return Create(ResultStatus.Success, data, msg);
        }

        public static RequestResult Create(ResultStatus status, string data, string msg)
        {
            RequestResult r = new RequestResult();
            r.Data = data;
            r.Status = status;
            r.Errmsg = msg;
            return r;
        }
    }
}