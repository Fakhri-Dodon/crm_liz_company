<?php

namespace App\Http\Controllers;

use App\Models\Section;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    public function index(Request $request)
    {
        $sectionName = $request->query('section_name');
        $query = Section::orderBy('order');
        if ($sectionName) {
            $query->where('section_name', $sectionName);
        }
        return response()->json($query->get());
    }

    public function show($id)
    {
        $section = Section::findOrFail($id);
        return response()->json($section);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'section_name' => 'required|string|max:50',
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'image_path' => 'nullable|string|max:255',
            'type' => 'required|in:text,image,text_image,image_text',
            'order' => 'nullable|integer',
        ]);
        $section = Section::create($validated);
        return response()->json($section, 201);
    }

    public function update(Request $request, $id)
    {
        $section = Section::findOrFail($id);
        $validated = $request->validate([
            'section_name' => 'required|string|max:50',
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'image_path' => 'nullable|string|max:255',
            'type' => 'required|in:text,image,text_image,image_text',
            'order' => 'nullable|integer',
        ]);
        $section->update($validated);
        return response()->json($section);
    }

    public function destroy($id)
    {
        $section = Section::findOrFail($id);
        $section->delete();
        return response()->json(['message' => 'Section deleted']);
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'order' => 'required|array',
            'order.*' => 'integer|exists:sections,id',
        ]);
        foreach ($validated['order'] as $index => $id) {
            Section::where('id', $id)->update(['order' => $index]);
        }
        return response()->json(['message' => 'Order updated']);
    }
}
