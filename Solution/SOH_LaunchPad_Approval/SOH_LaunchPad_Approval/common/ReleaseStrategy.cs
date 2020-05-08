using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SOH_LaunchPad_Approval.common
{
    public class ReleaseStrategy
    {
        public List<string> ReleaseGp;
        public List<string> ReleaseCode;
        public List<string> Plant;

        public string ClaimApproverLevel;

        public ReleaseStrategy()
        {
            ReleaseGp = new List<string>();
            ReleaseCode = new List<string>();
            Plant = new List<string>();
        }
    }
}