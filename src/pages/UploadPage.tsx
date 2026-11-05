import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resourcesApi } from '../api/resources';
import { useAuth } from '../context/AuthContext';
import { resourceUploadSchema, type ResourceUploadValues } from '../lib/resourceValidation';

export function UploadPage() {
  const { isAuthenticated, user } = useAuth();
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');
  const {register,handleSubmit,formState:{errors,isSubmitting},reset}=useForm<ResourceUploadValues>({
    resolver:zodResolver(resourceUploadSchema),
    defaultValues:{title:'',description:'',course:'',topic:'',institution:'',level:'',type:'lecture_notes',license:'CC-BY-4.0',attribution:'',rightsConfirmed:false,tags:''}
  });
  const submit=async(v:ResourceUploadValues)=>{
    setError('');setSuccess('');
    try {
      const result=await resourcesApi.create({title:v.title.trim(),description:v.description.trim(),course:v.course.trim(),topic:v.topic.trim(),institution:v.institution.trim()||user?.institution||'',level:v.level.trim(),type:v.type,license:v.license,attribution:v.attribution.trim(),rightsConfirmed:v.rightsConfirmed,tags:v.tags.split(',').map(x=>x.trim()).filter(Boolean)});
      if(!result.id) throw new Error('The server did not return a resource ID.');
      setSuccess('Your contribution has been submitted for moderator review.');
      reset({title:'',description:'',course:'',topic:'',institution:user?.institution||'',level:'',type:'lecture_notes',license:'CC-BY-4.0',attribution:'',rightsConfirmed:false,tags:''});
    } catch(e) { setError(e instanceof Error?e.message:'Submission failed.'); }
  };
  const field='brand-input';
  return <div className="mx-auto max-w-4xl rounded-2xl border border-[#DCE4EF] bg-white p-6">
    <h2 className="text-2xl font-bold text-[#091F5B]">Contribute academic material</h2>
    <p className="mt-2 text-sm text-[#5C6982]">Students and lecturers can submit notes, past questions, research and study resources. All submissions are reviewed before publication.</p>
    <form onSubmit={handleSubmit(submit)} className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">Title<input className={field} {...register('title')}/>{errors.title?.message}</label>
      <label className="text-sm font-semibold">Material type<select className={field} {...register('type')}><option value="lecture_notes">Lecture notes</option><option value="past_question">Past question</option><option value="research_paper">Research paper</option><option value="project">Project</option><option value="slides">Slides</option><option value="other">Other</option></select></label>
      <label className="text-sm font-semibold">Course / subject<input className={field} {...register('course')}/>{errors.course?.message}</label>
      <label className="text-sm font-semibold">Topic<input className={field} {...register('topic')}/>{errors.topic?.message}</label>
      <label className="text-sm font-semibold">Institution<input className={field} {...register('institution')}/>{errors.institution?.message}</label>
      <label className="text-sm font-semibold">Academic level<input className={field} {...register('level')}/>{errors.level?.message}</label>
      <label className="sm:col-span-2 text-sm font-semibold">Description<textarea rows={4} className={field} {...register('description')}/>{errors.description?.message}</label>
      <label className="text-sm font-semibold">Licence<select className={field} {...register('license')}><option value="CC-BY-4.0">CC BY 4.0</option><option value="CC-BY-SA-4.0">CC BY-SA 4.0</option><option value="CC0-1.0">CC0 1.0</option><option value="ALL-RIGHTS-RESERVED">All rights reserved</option></select></label>
      <label className="text-sm font-semibold">Attribution<input className={field} placeholder="Author / source credit" {...register('attribution')}/>{errors.attribution?.message}</label>
      <label className="sm:col-span-2 text-sm font-semibold">Tags<input className={field} placeholder="comma-separated" {...register('tags')}/></label>
      <label className="sm:col-span-2 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm leading-6"><input type="checkbox" className="mt-1" {...register('rightsConfirmed')}/><span>I confirm I created this work or have permission to share it under the selected licence. I understand it will be reviewed before publication.</span></label>
      {errors.rightsConfirmed?.message&&<p className="sm:col-span-2 text-sm text-rose-700">{errors.rightsConfirmed.message}</p>}
      {error&&<p role="alert" className="sm:col-span-2 text-sm text-rose-700">{error}</p>}{success&&<p role="status" className="sm:col-span-2 text-sm text-emerald-800">{success}</p>}
      <button disabled={!isAuthenticated||isSubmitting} className="sm:col-span-2 rounded-xl bg-[#6121D0] px-4 py-3 font-semibold text-white disabled:opacity-50">{isSubmitting?'Submitting…':'Submit for review'}</button>
    </form>
  </div>;
}
