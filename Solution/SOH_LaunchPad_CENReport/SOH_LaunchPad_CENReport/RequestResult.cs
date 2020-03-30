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

        public RequestResult(ResultStatus status)
        {
            Status = status;
        }

        public enum ResultStatus
        {
            Success = 1,
            Failure = 0
        }
    }
}