using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace pim360_import
{
    class ImportActivityResponse
    {
        public ImportActivity data { get; set; }
    }

    class ImportActivity
    {
        public string etlActHdl { get; set; }
        public string etlScript { get; set; }
        public ETLJob etlJob { get; set; }
    }

    class ETLJob
    {
        public string act_name { get; set; }
        public string act_type { get; set; }
        public string act_id { get; set; }
        public string user_name { get; set; }
        public string user_job { get; set; }
        public string user_handle { get; set; }
        public string auth_address { get; set; }
        public string project_id { get; set; }
        public string object_type { get; set; }
        public string source_handle { get; set; }
        public string eic_handle { get; set; }
        public string deliverable { get; set; }
        public string classification { get; set; }
        public string ens_name { get; set; }
        public string terminate_attributes { get; set; }
        public string load_unknown_attributes { get; set; }
        public int worksheets { get; set; }
        public string default_class { get; set; }
        public string allow_new { get; set; }
        public string pre_script { get; set; }
        public string uom_label { get; set; }
        public string inputfile { get; set; }
        public string act_handle { get; set; }
    }
}
